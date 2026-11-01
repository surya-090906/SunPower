// Native React page. Data contract: backoffice/tabs/overview.
import {
  Fragment,
  cssStyle,
  text,
  Field,
  ActionForm,
  CsrfField,
} from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      <div className={"grid g-main"}>
        {"\n  "}
        <div className={"stack"}>
          {"\n    "}
          <div className={"card"}>
            <div className={"card-h"}>
              <h2>{"Enquiry"}</h2>
              <span className={"small muted"}>{data.v1}</span>
            </div>
            <div className={"card-b"}>
              {"\n      "}
              <dl className={"kv"}>
                {"\n        "}
                <dt>{"Customer"}</dt>
                <dd>
                  {data.v2}
                  {" · "}
                  {data.v3}
                  {data.choice4 === 0 ? (
                    <>
                      {" · "}
                      {data.v5}
                    </>
                  ) : null}
                </dd>
                {"\n        "}
                <dt>{"Site"}</dt>
                <dd>
                  {data.v6}
                  {data.choice7 === 0 ? (
                    <>
                      {", "}
                      {data.v8}
                    </>
                  ) : null}
                  {data.choice9 === 0 ? (
                    <>
                      <br />
                      <a
                        href={text(data.v10)}
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"View selected location on map"}
                      </a>
                    </>
                  ) : null}
                </dd>
                {"\n        "}
                <dt>{"Wants"}</dt>
                <dd>
                  {data.v11}
                  {" for a "}
                  {data.v12}
                  {data.choice13 === 0 ? (
                    <>{", with the government subsidy"}</>
                  ) : null}
                </dd>
                {"\n        "}
                {data.choice14 === 0 ? (
                  <>
                    <dt>{"Best time to call"}</dt>
                    <dd>{data.v15}</dd>
                  </>
                ) : null}
                {"\n        "}
                {data.choice16 === 0 ? (
                  <>
                    <dt>{"Customer told us"}</dt>
                    <dd className={"small"}>
                      {data.choice17 === 0 ? (
                        <>
                          {data.v18}
                          {" sq ft roof · "}
                        </>
                      ) : null}
                      {data.choice19 === 0 ? (
                        <>
                          {"bill ₹"}
                          {data.v20}
                          {" · "}
                        </>
                      ) : null}
                      {data.choice21 === 0 ? (
                        <>
                          {data.v22}
                          {" roof · "}
                        </>
                      ) : null}
                      {data.choice23 === 0 ? (
                        <>
                          {data.v24}
                          {" kW load · "}
                        </>
                      ) : null}
                      {data.choice25 === 0 ? <>{data.v26}</> : null}
                    </dd>
                  </>
                ) : null}
                {"\n        "}
                {data.choice27 === 0 ? (
                  <>
                    <dt>{"Notes"}</dt>
                    <dd className={"small"}>{data.v28}</dd>
                  </>
                ) : null}
                {"\n        "}
                {data.choice29 === 0 ? (
                  <>
                    <dt>{"Lost because"}</dt>
                    <dd>
                      <span className={"badge b-red"}>{data.v30}</span>
                    </dd>
                  </>
                ) : null}
                {"\n      "}
              </dl>
            </div>
          </div>
          {"\n    "}
          <div className={"card"}>
            <div className={"card-h"}>
              <h2>{"Money"}</h2>
            </div>
            <div className={"card-b"}>
              {"\n      "}
              <div className={"grid g4"}>
                {"\n        "}
                <div>
                  <div className={"muted small"}>{"Contract (ex-GST)"}</div>
                  <div className={"bold"} style={cssStyle("font-size:1.15rem")}>
                    {data.v31}
                  </div>
                </div>
                {"\n        "}
                <div>
                  <div className={"muted small"}>{"Quote total"}</div>
                  <div className={"bold"} style={cssStyle("font-size:1.15rem")}>
                    {data.v32}
                  </div>
                </div>
                {"\n        "}
                <div>
                  <div className={"muted small"}>{"Paid"}</div>
                  <div className={"bold"} style={cssStyle("font-size:1.15rem")}>
                    {data.v33}
                  </div>
                </div>
                {"\n        "}
                <div>
                  <div className={"muted small"}>{"Balance due"}</div>
                  <div className={"bold"} style={cssStyle("font-size:1.15rem")}>
                    {data.v34}
                  </div>
                </div>
                {"\n      "}
              </div>
              {"\n      "}
              {data.choice35 === 0 ? (
                <>
                  <hr />
                  <div className={"spread"}>
                    <div>
                      <span className={"muted small"}>
                        {data.choice36 === 0 ? (
                          <>{"Estimated profit"}</>
                        ) : data.choice36 === 1 ? (
                          <>{"Profit to date"}</>
                        ) : null}
                      </span>
                      <div
                        className={"bold"}
                        style={cssStyle(
                          "font-size:1.3rem;color:" +
                            (data.choice37 === 0
                              ? "var(--red)"
                              : data.choice37 === 1
                                ? "var(--green)"
                                : ""),
                        )}
                      >
                        {data.v38}
                        {data.choice39 === 0 ? (
                          <>
                            {" "}
                            <span className={"small"}>
                              {"("}
                              {data.v40}
                              {"%)"}
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    {"\n        "}
                    <a
                      className={"btn btn-line btn-sm"}
                      href={"/app/insights/p/" + text(data.v41) + "/"}
                    >
                      {"Job profit detail"}
                    </a>
                  </div>
                </>
              ) : null}
              {"\n    "}
            </div>
          </div>
          {"\n  "}
        </div>
        {"\n  "}
        <div className={"stack"}>
          {"\n    "}
          <div className={"card"}>
            <div className={"card-h"}>
              <h2>{"Recent activity"}</h2>
              <a className={"small"} href={"?tab=timeline"}>
                {"All"}
              </a>
            </div>
            <div className={"card-b"}>
              <ul className={"tl"}>
                {"\n      "}
                {data.rows42?.length ? (
                  data.rows42.map((row42, index) => (
                    <Fragment key={index}>
                      <li>
                        <span className={"when"}>{row42.v43}</span>
                        <span className={"what small"}>{row42.v44}</span>
                      </li>
                    </Fragment>
                  ))
                ) : (
                  <>
                    <li className={"muted"}>{"Nothing yet."}</li>
                  </>
                )}
              </ul>
            </div>
          </div>
          {"\n    "}
          {data.choice45 === 0 ? (
            <>
              <div className={"card"}>
                <div className={"card-h"}>
                  <h2>{"Last customer message"}</h2>
                </div>
                <div className={"card-b"}>
                  <p className={"small"}>{data.v46}</p>
                  {data.choice47 === 0 ? (
                    <>
                      <a
                        className={"btn btn-ok btn-sm"}
                        href={text(data.v48)}
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"Open in WhatsApp"}
                      </a>
                    </>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
          {"\n    "}
          <div className={"card"}>
            <div className={"card-h"}>
              <h2>{"Actions"}</h2>
            </div>
            <div className={"card-b stack"}>
              {"\n      "}
              {data.choice49 === 0 ? (
                <>
                  <ActionForm
                    method={"post"}
                    action={"/app/p/" + text(data.v50) + "/do/invite/"}
                  >
                    <CsrfField />
                    <button className={"btn btn-line btn-block"}>
                      {"Send portal invitation"}
                    </button>
                  </ActionForm>
                </>
              ) : null}
              {"\n      "}
              {data.choice51 === 0 ? (
                <>
                  {"\n      "}
                  <ActionForm
                    method={"post"}
                    action={"/app/p/" + text(data.v52) + "/do/lost/"}
                    className={"stack"}
                    data-confirm={"Mark this enquiry as lost?"}
                  >
                    <CsrfField />
                    <Field
                      className={"inp"}
                      name={"reason"}
                      placeholder={"Reason (required)"}
                    />
                    <button className={"btn btn-danger btn-block"}>
                      {"Mark as lost"}
                    </button>
                  </ActionForm>
                </>
              ) : null}
              {"\n    "}
            </div>
          </div>
          {"\n  "}
        </div>
        {"\n"}
      </div>
      {"\n"}
    </>
  );
}
