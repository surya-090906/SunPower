// Native React page. Data contract: backoffice/schedule.
import { Fragment, cssStyle, text, Field } from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      <div className={"page-head"}>
        <div>
          <a className={"small"} href={"/app/field/"}>
            {"‹ Field jobs"}
          </a>
          <h1 style={cssStyle("margin-top:.3rem")}>{"Schedule board"}</h1>
          <div className={"sub"}>
            {
              "The next seven working days. Assignments are made automatically: least-loaded technicians first."
            }
          </div>
        </div>
      </div>
      {"\n"}
      {data.choice1 === 0 ? (
        <>
          <div className={"banner warn mb"}>
            <span className={"ico"}>{"↻"}</span>
            <div>
              <div className={"big"}>{"Customers asked to reschedule"}</div>
              <div className={"small"}>
                {"\n  "}
                {data.rows2?.length ? (
                  data.rows2.map((row2, index) => (
                    <Fragment key={index}>
                      <div>
                        {"Survey "}
                        <a href={"/app/p/" + text(row2.v3) + "/?tab=survey"}>
                          {row2.v4}
                        </a>
                        {': "'}
                        {row2.v5}
                        {'"'}
                      </div>
                    </Fragment>
                  ))
                ) : (
                  <></>
                )}
                {"\n  "}
                {data.rows6?.length ? (
                  data.rows6.map((row6, index) => (
                    <Fragment key={index}>
                      <div>
                        {"Install "}
                        <a href={"/app/p/" + text(row6.v7) + "/?tab=install"}>
                          {row6.v8}
                        </a>
                        {': "'}
                        {row6.v9}
                        {'"'}
                      </div>
                    </Fragment>
                  ))
                ) : (
                  <></>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
      {"\n"}
      <div className={"grid g2"}>
        {"\n"}
        {data.rows10?.length ? (
          data.rows10.map((row10, index) => (
            <Fragment key={index}>
              {"\n"}
              <div className={"card"}>
                <div className={"card-h"}>
                  <h2>{row10.v11}</h2>
                </div>
                <div className={"card-b small"}>
                  {"\n  "}
                  {row10.rows12?.length ? (
                    row10.rows12.map((row12, index) => (
                      <Fragment key={index}>
                        <div style={cssStyle("padding:.3rem 0")}>
                          <span className={"badge b-violet"}>{"Install"}</span>{" "}
                          <a
                            href={"/app/p/" + text(row12.v13) + "/?tab=install"}
                          >
                            {row12.v14}
                          </a>
                          {" · "}
                          {row12.v15}
                          <br />
                          <span className={"muted"}>
                            {row12.rows16?.length ? (
                              row12.rows16.map((row16, index) => (
                                <Fragment key={index}>
                                  {row16.v17}
                                  {row16.choice18 === 0 ? <>{", "}</> : null}
                                </Fragment>
                              ))
                            ) : (
                              <></>
                            )}
                          </span>{" "}
                          {row12.choice19 === 0 ? (
                            <>
                              <span className={"badge b-green"}>
                                {"confirmed"}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </Fragment>
                    ))
                  ) : (
                    <></>
                  )}
                  {"\n  "}
                  {row10.rows20?.length ? (
                    row10.rows20.map((row20, index) => (
                      <Fragment key={index}>
                        <div style={cssStyle("padding:.3rem 0")}>
                          <span className={"badge b-blue"}>{"Survey"}</span>{" "}
                          <a
                            href={"/app/p/" + text(row20.v21) + "/?tab=survey"}
                          >
                            {row20.v22}
                          </a>
                          <br />
                          <span className={"muted"}>{row20.v23}</span>{" "}
                          {row20.choice24 === 0 ? (
                            <>
                              <span className={"badge b-green"}>
                                {"confirmed"}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </Fragment>
                    ))
                  ) : (
                    <></>
                  )}
                  {"\n  "}
                  {row10.rows25?.length ? (
                    row10.rows25.map((row25, index) => (
                      <Fragment key={index}>
                        <div style={cssStyle("padding:.3rem 0")}>
                          <span className={"badge b-amber"}>{"Service"}</span>{" "}
                          <a
                            href={"/app/help/tickets/" + text(row25.v26) + "/"}
                          >
                            {row25.v27} {row25.v28}
                          </a>
                          <br />
                          <span className={"muted"}>{row25.v29}</span>
                        </div>
                      </Fragment>
                    ))
                  ) : (
                    <></>
                  )}
                  {"\n  "}
                  {row10.choice30 === 0 ? (
                    <>
                      <span className={"muted"}>{"Nothing scheduled."}</span>
                    </>
                  ) : null}
                  {"\n"}
                </div>
              </div>
            </Fragment>
          ))
        ) : (
          <></>
        )}
        {"\n"}
      </div>
      {"\n"}
    </>
  );
}
