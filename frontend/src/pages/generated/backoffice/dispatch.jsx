// Native React page. Data contract: backoffice/dispatch.
import {
  Fragment,
  cssStyle,
  text,
  FieldGroup,
  Field,
  TextArea,
  ActionForm,
  CsrfField,
} from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      <div className={"page-head"}>
        <div>
          <a className={"small"} href={"/app/inventory/dispatch/"}>
            {"‹ Pick lists"}
          </a>
          {"\n  "}
          <div className={"row"} style={cssStyle("margin-top:.3rem")}>
            <h1>{data.v1}</h1>
            <span className={"badge " + text(data.v2)}>{data.v3}</span>
          </div>
          {"\n  "}
          <div className={"sub"}>
            <a href={"/app/p/" + text(data.v4) + "/"}>{data.v5}</a>
            {" · "}
            {data.v6}
            {" · "}
            {data.v7}
          </div>
        </div>
        {"\n  "}
        {data.choice8 === 0 ? (
          <>
            <a
              className={"btn btn-line"}
              href={"/doc/delivery/" + text(data.v9) + "/"}
            >
              {"Delivery note"}
            </a>
          </>
        ) : null}
      </div>
      {"\n\n"}
      {data.choice10 === 0 ? (
        <>
          <div className={"banner bad mb"}>
            <span className={"ico"}>{"⚠"}</span>
            <div>
              <div className={"big"}>{"Waiting for stock"}</div>
              <div className={"small"}>
                {
                  'The order is confirmed but the warehouse is short. It moves to "To pick" by itself when the missing items are received.'
                }
              </div>
              {"\n  "}
              <div className={"small mt-s"}>
                {data.rows11?.length ? (
                  data.rows11.map((row11, index) => (
                    <Fragment key={index}>
                      {row11.choice12 === 0 ? (
                        <>
                          <b>{row11.v13}</b>
                          {": short by "}
                          {row11.v14}
                          {". "}
                        </>
                      ) : null}
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
      {"\n\n"}
      <div className={"grid g-main"}>
        {"\n  "}
        <div className={"stack"}>
          {"\n    "}
          <div className={"card"}>
            <div className={"card-h"}>
              <h2>{"Items to pack"}</h2>
              <span className={"small muted"}>
                {"Serial-tracked units: "}
                {data.v15}
                {" of "}
                {data.v16}
                {" scanned"}
              </span>
            </div>
            {"\n      "}
            <div className={"card-b"}>
              <div className={"progress " + (data.choice17 === 0 ? "ok" : "")}>
                <i style={cssStyle("width:" + text(data.v18) + "%")}></i>
              </div>
            </div>
            {"\n      "}
            <div
              className={"card-b tight tbl-wrap"}
              style={cssStyle("border-top:1px solid var(--line)")}
            >
              <table className={"table"}>
                <thead>
                  <tr>
                    <th>{"Item"}</th>
                    <th className={"num"}>{"Need"}</th>
                    <th className={"num"}>{"Picked"}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows19?.length ? (
                    data.rows19.map((row19, index) => (
                      <Fragment key={index}>
                        <tr>
                          <td>
                            {row19.v20}
                            {row19.choice21 === 0 ? (
                              <>
                                {" "}
                                <span className={"badge b-blue"}>
                                  {"serial"}
                                </span>
                              </>
                            ) : null}
                            {"\n            "}
                            {row19.choice22 === 0 ? (
                              <>
                                <div className={"picked mt-s"}>
                                  {row19.rows23?.length ? (
                                    row19.rows23.map((row23, index) => (
                                      <Fragment key={index}>
                                        <span className={"badge b-green"}>
                                          {row23.v24}
                                        </span>
                                      </Fragment>
                                    ))
                                  ) : (
                                    <></>
                                  )}
                                </div>
                              </>
                            ) : null}
                          </td>
                          <td className={"num"}>{row19.v25}</td>
                          <td className={"num"}>
                            {row19.choice26 === 0 ? (
                              <>
                                <span className={"badge b-green"}>
                                  {"✓ "}
                                  {row19.v27}
                                </span>
                              </>
                            ) : row19.choice26 === 1 ? (
                              <>{row19.v28}</>
                            ) : null}
                          </td>
                          <td className={"right"}>
                            {row19.choice29 === 0 ? (
                              <>
                                <ActionForm
                                  method={"post"}
                                  action={
                                    "/app/inventory/dispatch/" +
                                    text(row19.v30) +
                                    "/do/"
                                  }
                                  className={"inline-form"}
                                >
                                  <CsrfField />
                                  <Field
                                    type={"hidden"}
                                    name={"action"}
                                    value={"pack"}
                                  />
                                  <Field
                                    type={"hidden"}
                                    name={"line"}
                                    value={text(row19.v31)}
                                  />
                                  <button className={"btn btn-line btn-sm"}>
                                    {"Mark packed"}
                                  </button>
                                </ActionForm>
                              </>
                            ) : null}
                          </td>
                        </tr>
                      </Fragment>
                    ))
                  ) : (
                    <></>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {"\n  "}
        </div>
        {"\n  "}
        <div className={"stack"}>
          {"\n    "}
          {data.choice32 === 0 ? (
            <>
              {data.choice33 === 0 ? (
                <>
                  {"\n    "}
                  <div className={"card"}>
                    <div className={"card-h"}>
                      <h2>{"Scan a serial number"}</h2>
                    </div>
                    <div className={"card-b"}>
                      {"\n      "}
                      <ActionForm
                        method={"post"}
                        action={
                          "/app/inventory/dispatch/" + text(data.v34) + "/do/"
                        }
                        className={"stack"}
                      >
                        <CsrfField />
                        <Field type={"hidden"} name={"action"} value={"scan"} />
                        {"\n        "}
                        <div className={"scanbox"}>
                          <Field
                            className={"inp"}
                            name={"serial"}
                            placeholder={"Scan or type"}
                            autoComplete={"off"}
                            autoFocus={true}
                          />
                          <button className={"btn btn-primary"}>
                            {"Scan"}
                          </button>
                        </div>
                      </ActionForm>
                      {"\n      "}
                      {data.choice35 === 0 ? (
                        <>
                          <ActionForm
                            method={"post"}
                            action={
                              "/app/inventory/dispatch/" +
                              text(data.v36) +
                              "/do/"
                            }
                            className={"mt-s"}
                          >
                            <CsrfField />
                            <Field
                              type={"hidden"}
                              name={"action"}
                              value={"demo_next"}
                            />
                            <button className={"btn btn-line btn-sm"}>
                              {"Scan next (demo)"}
                            </button>
                          </ActionForm>
                        </>
                      ) : null}
                      {"\n      "}
                      <details className={"mt"}>
                        <summary
                          className={"small muted"}
                          style={cssStyle("cursor:pointer")}
                        >
                          {"Paste a list (for panels)"}
                        </summary>
                        {"\n        "}
                        <ActionForm
                          method={"post"}
                          action={
                            "/app/inventory/dispatch/" + text(data.v37) + "/do/"
                          }
                          className={"stack mt-s"}
                        >
                          <CsrfField />
                          <Field
                            type={"hidden"}
                            name={"action"}
                            value={"bulk"}
                          />
                          <TextArea
                            className={"inp mono"}
                            name={"bulk"}
                            rows={"4"}
                            placeholder={"One serial per line"}
                          ></TextArea>
                          <button className={"btn btn-line btn-sm"}>
                            {"Scan all"}
                          </button>
                        </ActionForm>
                      </details>
                      {"\n    "}
                    </div>
                  </div>
                  {"\n    "}
                  <div className={"card"}>
                    <div className={"card-h"}>
                      <h2>{"Dispatch"}</h2>
                    </div>
                    <div className={"card-b"}>
                      {"\n      "}
                      {data.choice38 === 0 ? (
                        <>
                          <ActionForm
                            method={"post"}
                            action={
                              "/app/inventory/dispatch/" +
                              text(data.v39) +
                              "/do/"
                            }
                            className={"stack"}
                          >
                            <CsrfField />
                            <Field
                              type={"hidden"}
                              name={"action"}
                              value={"dispatch"}
                            />
                            {"\n        "}
                            <FieldGroup className={"field"}>
                              <label>{"Vehicle number"}</label>
                              <Field
                                className={"inp"}
                                name={"vehicle"}
                                placeholder={"KA 01 AB 1234"}
                              />
                            </FieldGroup>
                            <FieldGroup className={"field"}>
                              <label>{"Driver"}</label>
                              <Field className={"inp"} name={"driver"} />
                            </FieldGroup>
                            {"\n        "}
                            <button
                              className={"btn btn-primary btn-lg btn-block"}
                            >
                              {"Dispatch"}
                            </button>
                          </ActionForm>
                          {"\n      "}
                        </>
                      ) : data.choice38 === 1 ? (
                        <>
                          <div className={"gate"}>
                            {"🔒 "}
                            {data.v40}
                          </div>
                          <button
                            className={
                              "btn btn-primary btn-block mt-s is-disabled"
                            }
                            title={text(data.v41)}
                            aria-disabled={"true"}
                          >
                            {"Dispatch"}
                          </button>
                        </>
                      ) : null}
                      {"\n    "}
                    </div>
                  </div>
                  {"\n    "}
                </>
              ) : null}
            </>
          ) : null}
          {"\n    "}
          {data.choice42 === 0 ? (
            <>
              <div className={"card"}>
                <div className={"card-h"}>
                  <h2>{"On the road"}</h2>
                </div>
                <div className={"card-b stack"}>
                  {"\n      "}
                  <div className={"small muted"}>
                    {"Dispatched "}
                    {data.v43}
                    {data.choice44 === 0 ? (
                      <>
                        {" · "}
                        {data.v45}
                      </>
                    ) : null}
                    {data.choice46 === 0 ? (
                      <>
                        {" · "}
                        {data.v47}
                      </>
                    ) : null}
                    {data.choice48 === 0 ? (
                      <>
                        {" · value on truck "}
                        {data.v49}
                        {" at cost"}
                      </>
                    ) : null}
                  </div>
                  {"\n      "}
                  <ActionForm
                    method={"post"}
                    action={
                      "/app/inventory/dispatch/" + text(data.v50) + "/do/"
                    }
                    className={"stack"}
                  >
                    <CsrfField />
                    <Field type={"hidden"} name={"action"} value={"deliver"} />
                    <Field
                      className={"inp"}
                      name={"received_by"}
                      placeholder={"Received by (customer name)"}
                    />
                    <button className={"btn btn-ok btn-block"}>
                      {"Confirm delivery"}
                    </button>
                  </ActionForm>
                  {"\n      "}
                  <p className={"hint"}>
                    {
                      "Confirming delivery starts the warranty on every serial number in this load. Technicians can also confirm it from their phone."
                    }
                  </p>
                </div>
              </div>
            </>
          ) : null}
          {"\n    "}
          {data.choice51 === 0 ? (
            <>
              <div className={"banner ok"}>
                <span className={"ico"}>{"✓"}</span>
                <div>
                  {"Delivered "}
                  {data.v52}
                  {data.choice53 === 0 ? (
                    <>
                      {", received by "}
                      {data.v54}
                    </>
                  ) : null}
                  {". Warranty is running."}
                </div>
              </div>
            </>
          ) : null}
          {"\n  "}
        </div>
        {"\n"}
      </div>
      {"\n"}
    </>
  );
}
